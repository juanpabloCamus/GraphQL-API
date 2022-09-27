import {} from 'dotenv/config'
import {ApolloServer, UserInputError, gql, AuthenticationError} from 'apollo-server';
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
        addAsFriend(
            name: String!
        ): User
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
        },
        me: (root, args, context) => {
            return context.currentUser
        }
    },
    Mutation: {
        addPerson: async (root, args, context) => {
            const {currentUser} = context
            if(!currentUser) throw new AuthenticationError('not authenticated')
            
            const person = new Person({...args})

            try {
                person.save();
                currentUser.friends = currentUser.friends.concat(person);
                await currentUser.save()
                return person
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
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
        },
        addAsFriend: async (root, args, {currentUser}) => {
            if(!currentUser) throw new AuthenticationError('not authenticated');

            const person = await Person.findOne({name: args.name});

            const nonFriendlyAlready = person => !currentUser.friends
                .map(p => p._id)
                .includes(person._id)

            if (nonFriendlyAlready(person)) {
                currentUser.friends = currentUser.friends.concat(person);
                await currentUser.save()
            }

            return currentUser
        }
    },
    Person: {
        address: (root) => `${root.street}, ${root.city}`
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLocaleLowerCase().startsWith('bearer ')) {
            const token = auth.substring(7)
            const {id} = jwt.verify(token, JWT_SECRET)
            const currentUser = await User.findById(id).populate('friends')
            return { currentUser }
        }
    }
})

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`);
})
