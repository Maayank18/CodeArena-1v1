import Note from '../models/Note.js';

const normalizeNoteIdentity = ({ type, contextTitle, contextKey }) => ({
    type: typeof type === 'string' ? type.trim() : '',
    contextTitle: typeof contextTitle === 'string' ? contextTitle.trim() : '',
    contextKey: typeof contextKey === 'string' ? contextKey.trim() : '',
});

export const getNotes = async (req, res) => {
    try {
        const userId = req.user?._id;
        const notes = await Note.find({ user: userId }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
};

export const getNoteByContext = async (req, res) => {
    try {
        const { type, contextTitle, contextKey } = normalizeNoteIdentity(req.query);
        
        if (!type || !contextTitle) {
            return res.status(400).json({ success: false, message: 'Type and contextTitle are required' });
        }

        const userId = req.user?._id;
        const note = await Note.findOne({
            user: userId,
            type,
            ...(contextKey
                ? { $or: [{ contextKey }, { contextTitle }] }
                : { contextTitle }),
        });
        
        res.status(200).json({ success: true, note });
    } catch (error) {
        console.error('Error fetching context note:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch note for this context' });
    }
};

export const saveNote = async (req, res) => {
    try {
        const { type, contextTitle, contextKey } = normalizeNoteIdentity(req.body);
        const content = typeof req.body?.content === 'string' ? req.body.content : '';

        if (!type || !contextTitle) {
            return res.status(400).json({ success: false, message: 'Type and contextTitle are required' });
        }

        const userId = req.user?._id;
        const lookup = {
            user: userId,
            type,
            ...(contextKey
                ? { $or: [{ contextKey }, { contextTitle }] }
                : { contextTitle }),
        };
        const existingNote = await Note.findOne(lookup);

        const note = existingNote
            ? await Note.findByIdAndUpdate(
                existingNote._id,
                { user: userId, type, contextTitle, contextKey, content },
                { new: true, runValidators: true }
            )
            : await Note.create({ user: userId, type, contextTitle, contextKey, content });

        res.status(200).json({ success: true, note, message: 'Note saved successfully' });
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ success: false, message: 'Failed to save note' });
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        
        const note = await Note.findOneAndDelete({ _id: id, user: userId });
        
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.status(200).json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
};
