import Note from '../models/Note.js';

export const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
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

        let note = await Note.findOne({ user: req.user.id, type, contextTitle });
        
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

        const note = await Note.findOneAndUpdate(
            { user: req.user.id, type, contextTitle },
            { content },
            { new: true, upsert: true }
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
        
        const note = await Note.findOneAndDelete({ _id: id, user: req.user.id });
        
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.status(200).json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
};
