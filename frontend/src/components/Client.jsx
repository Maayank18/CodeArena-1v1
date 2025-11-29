// import React from 'react';
// import Avatar from 'react-avatar';

// const Client = ({ username }) => {
//     return (
//         <div className="flex flex-col items-center gap-1 min-w-[60px]">
//             {/* The Avatar Circle */}
//             <Avatar 
//                 name={username} 
//                 size={45} 
//                 round="12px" 
//                 className="shadow-lg transition-transform duration-200 hover:scale-110 border-2 border-transparent hover:border-accent" 
//             />
            
//             {/* The Username Label */}
//             <span className="text-xs font-bold text-gray-400 max-w-[70px] truncate text-center">
//                 {username}
//             </span>
//         </div>
//     );
// };

// export default Client;




// RESPONSIVE CHANGE 
import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username }) => {
    return (
        <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]">
            {/* The Avatar Circle */}
            <Avatar 
                name={username} 
                // Responsive Size: 35px on mobile, 45px on desktop
                size="45" 
                round="12px" 
                className="shadow-lg transition-transform duration-200 hover:scale-110 border-2 border-transparent hover:border-accent !w-[35px] !h-[35px] sm:!w-[45px] sm:!h-[45px]" 
            />
            
            {/* The Username Label */}
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 max-w-[50px] sm:max-w-[70px] truncate text-center">
                {username}
            </span>
        </div>
    );
};

export default Client;