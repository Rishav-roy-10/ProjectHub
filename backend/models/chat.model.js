import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: { // New field
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    deletedFor: [{ // Track which users have deleted this message
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const chatSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    messages: [messageSchema],
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
chatSchema.index({ projectId: 1 });
chatSchema.index({ lastMessage: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
