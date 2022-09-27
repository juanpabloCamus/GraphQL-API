import {} from 'dotenv/config'
import {ApolloServer, UserInputError, gql} from 'apollo-server';
import './db.js';
import Person from './models/person.js';
import User from './models/user.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

const typeDefs = gql`

    enum YesNo{
        YES
        NO
    }

    type Person {
        name: String!
        phone: String
        street: String!
        city: String
        address: String!
        id: ID!
    }

    type User {
        username: String!
        friends: [Person]!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPerson(name: String!): Person
        me: User
    }

    type Token {
        value: String!
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
            id: ID
        ): Person
        editNumber(
            name: String!
            phone: String!
        ): Person
        createUser(
            username: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
    }
`

const resolvers = {
    Query: {
        personCount: () => Person.collection.countDocuments(),
        allPersons: async (root, args) => {
            if(!args.phone) return Person.find()
            return Person.find({ phone: { $exists: args.phone === 'YES' } })
        },
        findPerson: (root, args) => {
            const {name} = args;
            return Person.findOne({ name })
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            const person = new Person({...args})
            return person.save()
        },
        editNumber: async (root, args) => {
            const person = await Person.findOne({name: args.name})
            if (!person) return
        
            person.phone = args.phone
            
            try {
                await person.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            
            return person
        },
        createUser: (root, args) => {
            const user = new User({ username: args.username })
            return user.save().catch(e => {
                throw new UserInputError(e.message, {
                    invalidArgs: args
                })
            })
        },
        login: async (root, args) => {
            const user = await User.findOne({username: args.username});
            if (!user || args.password !== 'secret') {
                throw new UserInputError('wrong credentials')
            }

            const userForToken = {
                username: user.username,
                id: user._id
            }

            return {
                value: jwt.sign(userForToken, JWT_SECRET)
            }
        }
    },
    Person: {
        address: (root) => `${root.street}, ${root.city}`
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`);
})
