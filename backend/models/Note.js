import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['battle_arena', 'campaign_editor'],
        required: true
    },
    contextTitle: {
        type: String,
        required: true,
        trim: true
    },
    contextKey: {
        type: String,
        trim: true,
        default: ''
    },
    content: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure a user can only have one note per specific context title
noteSchema.index({ user: 1, type: 1, contextTitle: 1 }, { unique: true });
noteSchema.index({ user: 1, type: 1, contextKey: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;
