// import React, { useState } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const Home = () => {
//     const navigate = useNavigate();
//     const [roomId, setRoomId] = useState('');
//     const [username, setUsername] = useState('');

//     const createNewRoom = async (e) => {
//         e.preventDefault();
//         try {
//             const response = await axios.post('/api/rooms');
//             setRoomId(response.data.roomId);
//             toast.success('Created a new room');
//         } catch (error) {
//             console.error(error);
//             setRoomId(uuidv4());
//             toast.error("Offline Mode: Generated local ID");
//         }
//     };

//     const joinRoom = () => {
//         if (!roomId || !username) {
//             toast.error('ROOM ID & Username is required');
//             return;
//         }
//         navigate(`/editor/${roomId}`, {
//             state: { username },
//         });
//     };

//     return (
//         <div className="flex items-center justify-center h-screen bg-dark text-white">
//             <div className="bg-[#282828] p-8 rounded-xl w-full max-w-md border border-[#3e3e42] shadow-2xl">
//                 <img src="/vite.svg" alt="logo" className="h-12 mb-6 mx-auto" />
//                 <h4 className="text-xl font-bold mb-6 text-center text-gray-200">Enter the Battle Arena</h4>
                
//                 <div className="flex flex-col gap-4">
//                     <input
//                         type="text"
//                         className="w-full p-3 rounded-lg bg-[#3e3e42] text-white outline-none border border-transparent focus:border-accent font-bold transition-all"
//                         placeholder="ROOM ID"
//                         onChange={(e) => setRoomId(e.target.value)}
//                         value={roomId}
//                     />
//                     <input
//                         type="text"
//                         className="w-full p-3 rounded-lg bg-[#3e3e42] text-white outline-none border border-transparent focus:border-accent font-bold transition-all"
//                         placeholder="USERNAME"
//                         onChange={(e) => setUsername(e.target.value)}
//                         value={username}
//                     />
//                     <button 
//                         className="w-full p-3 rounded-lg bg-accent text-black font-bold hover:bg-[#3bd175] transition-all duration-300 mt-2"
//                         onClick={joinRoom}
//                     >
//                         Join Battle
//                     </button>
                    
//                     <span className="text-center text-sm text-gray-500 mt-2">
//                         No invite? &nbsp;
//                         <a onClick={createNewRoom} className="text-accent cursor-pointer hover:underline underline-offset-2">
//                             Create New Room
//                         </a>
//                     </span>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Home;






// RESPONSIVE TWEAK CHANGES
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Logo } from '../components/Logo'; // Use your custom Logo component

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/rooms');
            setRoomId(response.data.roomId);
            toast.success('Created a new room');
        } catch (error) {
            console.error(error);
            setRoomId(uuidv4());
            toast.error("Offline Mode: Generated local ID");
        }
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & Username is required');
            return;
        }
        navigate(`/editor/${roomId}`, {
            state: { username },
        });
    };

    return (
        <div className="flex items-center justify-center h-screen bg-dark text-white px-4">
            {/* Responsive Card Container */}
            <div className="bg-[#282828] p-6 sm:p-8 rounded-xl w-full max-w-[340px] sm:max-w-md border border-[#3e3e42] shadow-2xl transition-all">
                
                {/* Logo Section */}
                <div className="flex justify-center mb-6 scale-90 sm:scale-100">
                    <Logo />
                </div>
                
                <h4 className="text-lg sm:text-xl font-bold mb-6 text-center text-gray-200">Enter the Battle Arena</h4>
                
                <div className="flex flex-col gap-3 sm:gap-4">
                    <input
                        type="text"
                        className="w-full p-3 rounded-lg bg-[#3e3e42] text-white outline-none border border-transparent focus:border-accent font-bold transition-all placeholder:text-gray-500 text-sm sm:text-base"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                    />
                    <input
                        type="text"
                        className="w-full p-3 rounded-lg bg-[#3e3e42] text-white outline-none border border-transparent focus:border-accent font-bold transition-all placeholder:text-gray-500 text-sm sm:text-base"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                    />
                    <button 
                        className="w-full p-3 rounded-lg bg-accent text-black font-bold hover:bg-[#3bd175] active:scale-95 transition-all duration-300 mt-2 text-sm sm:text-base"
                        onClick={joinRoom}
                    >
                        Join Battle
                    </button>
                    
                    <span className="text-center text-xs sm:text-sm text-gray-500 mt-2">
                        No invite? &nbsp;
                        <a onClick={createNewRoom} className="text-accent cursor-pointer hover:underline underline-offset-2">
                            Create New Room
                        </a>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Home;