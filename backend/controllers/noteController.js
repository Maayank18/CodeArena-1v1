import Note from '../models/Note.js';

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
        const { type, contextTitle } = req.query;
        
        if (!type || !contextTitle) {
            return res.status(400).json({ success: false, message: 'Type and contextTitle are required' });
        }

        const userId = req.user?._id;
        const note = await Note.findOne({ user: userId, type, contextTitle });
        
        res.status(200).json({ success: true, note });
    } catch (error) {
        console.error('Error fetching context note:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch note for this context' });
    }
};

export const saveNote = async (req, res) => {
    try {
        const { type, contextTitle, content } = req.body;

        if (!type || !contextTitle) {
            return res.status(400).json({ success: false, message: 'Type and contextTitle are required' });
        }

        const userId = req.user?._id;
        const note = await Note.findOneAndUpdate(
            { user: userId, type, contextTitle },
            { user: userId, content },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

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
