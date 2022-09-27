import { Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    friends: [
        {
            ref: 'Person',
            type: Schema.Types.ObjectId
        }
    ]
})

export default model('User', schema)