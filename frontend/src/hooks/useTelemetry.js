import { useAppSocket } from '../context/AppSocketContext.jsx';

export default function useTelemetry() {
    return useAppSocket();
}

// Version-2.0