import { useAppSocket } from '../context/AppSocketContext.jsx';

export default function useTelemetry() {
    return useAppSocket();
}
