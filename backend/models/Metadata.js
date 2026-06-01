import mongoose from 'mongoose';

const metadataSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index for ultra-fast key lookups
metadataSchema.index({ key: 1 });

const Metadata = mongoose.model('Metadata', metadataSchema);
export default Metadata;

// Version-2.0