import jwt from 'jsonwebtoken';

const CUSTOM_ROOM_TOKEN_TYPE = 'custom-room-join';

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for custom room authorization');
    }

    return process.env.JWT_SECRET;
};

export const signCustomRoomJoinToken = ({ roomId, userId }) => {
    const secret = getJwtSecret();

    return jwt.sign(
        {
            type: CUSTOM_ROOM_TOKEN_TYPE,
            roomId,
            userId: String(userId),
        },
        secret,
        { expiresIn: '12h' }
    );
};

export const verifyCustomRoomJoinToken = (token) => {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret);

    if (payload?.type !== CUSTOM_ROOM_TOKEN_TYPE || !payload?.roomId || !payload?.userId) {
        throw new Error('Invalid custom room join token');
    }

    return {
        roomId: payload.roomId,
        userId: String(payload.userId),
    };
};


// Version-2.0