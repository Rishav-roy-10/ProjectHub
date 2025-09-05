import mongoose from 'mongoose'
import User from './user.model.js'

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sharedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// Create a compound index for name and owner to ensure project names are unique per owner
projectSchema.index({ name: 1, owner: 1 }, { unique: true });

// Virtual to get all users who can access this project (owner + shared users)
projectSchema.virtual('allUsers').get(function() {
    return [this.owner, ...this.sharedUsers];
});

const Project = mongoose.model('Project', projectSchema);

export default Project;