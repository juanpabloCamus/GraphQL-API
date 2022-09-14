import {ApolloServer, gql} from 'apollo-server';

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
        phone : "044-123456" ,
        street : "Pasaje Testing" ,
        city : " Ibiza" ,
        id : ' 3d599471-3436-11e9 - bc57-8b80ba54c431'
    }
]

const typeDefs = gql`
    type Person {
        name: String!
        phone: String!
        street: String!
        city: String
        address: String!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons: [Person]!
        findPerson(name: String!): Person
    }
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: () => persons,
        findPerson: (root, args) => {
            const {name} = args
            return persons.find(p => p.name === name)
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
