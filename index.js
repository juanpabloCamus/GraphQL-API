import {} from 'dotenv/config'
import {ApolloServer,UserInputError, gql} from 'apollo-server';
import {v1 as uuid} from 'uuid';
import './db.js';
import Person from './models/person.js';

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

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPerson(name: String!): Person
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
    }
`

const resolvers = {
    Query: {
        personCount: () => Person.collection.countDocuments(),
        allPersons: async (root, args) => {
            return Person.find()
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
            person.phone = args.phone
            return person.save()
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
