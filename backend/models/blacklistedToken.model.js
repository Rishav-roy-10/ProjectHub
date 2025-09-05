import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true, // This creates the index automatically
  },
  blacklistedAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // Token expires after 24 hours
    index: { expireAfterSeconds: 0 }, // TTL index for auto-cleanup
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional: for tracking which user's token was blacklisted
  }
});

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

export default BlacklistedToken;
