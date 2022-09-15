import {ApolloServer,UserInputError, gql} from 'apollo-server';
import {v1 as uuid} from 'uuid';

const persons = [
    {
        name : "Midu" ,
        phone : "034-1234567" ,
        street : "Calle Frontend" ,
        city : "Barcelona" ,
        id : "3d594650-3434-11e9 - bc57-8b80ba54c431"
    } ,
    {
        name : "Youseff" ,
        phone : "044-123456", 
        street : "Avenida Fullstack" ,
        city : "Mataro " ,
        id : '3d599470-3436-11e9 - bc57-8b80ba54c431'
    },
    {
        name : "Itzi" ,
        street : "Pasaje Testing" ,
        city : " Ibiza" ,
        id : ' 3d599471-3436-11e9 - bc57-8b80ba54c431'
    }
]

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
        personCount: () => persons.length,
        allPersons: (root, args) => {
            if (args.phone === 'YES') {
                return persons.filter(p => p.phone)
            }
            if (args.phone === 'NO') {
                return persons.filter(p => !p.phone)
            }
            return persons
        },
        findPerson: (root, args) => {
            const {name} = args
            return persons.find(p => p.name === name)
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) throw new UserInputError('Name must be unique')
            const person = {...args, id:uuid()}
            persons.push(person)
            return person
        },
        editNumber: (root, args) => {
            const person = persons.find(p => p.name === args.name);
            if(!person) return null
            person.phone = args.phone;
            return person
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
