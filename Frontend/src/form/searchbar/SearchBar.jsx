import React, { useState, useRef, useEffect } from 'react';

const SearchBar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState('category');
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const handleSelectItem = (value) => {
        setSelectedItem(value);
        setDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex justify-center  w-full  mt-5">
            <div className="relative w-full max-w-sm min-w-[200px]">
            <div className=' flex space-x-2'>
                <div className="absolute top-1 left-1 flex items-center">
                    <button 
                        ref={buttonRef}
                        id="dropdownButton" 
                        className="rounded border border-transparent py-1 px-1.5 text-center flex items-center text-sm transition-all text-white" 
                        onClick={toggleDropdown}
                    >
                        <span id="dropdownSpan" className="text-ellipsis overflow-hidden">{selectedItem}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 ml-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {dropdownOpen && (
                        <div 
                            id="dropdownMenu" 
                            ref={dropdownRef} 
                            className="absolute top-8 left-0 min-w-[150px] overflow-hidden w-full bg-white border border-slate-200 rounded-md shadow-lg z-50"
                        >
                            <ul id="dropdownOptions">
                                <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Category')}>Category</li>
                                <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('yoga')}>Yoga</li>
                                <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Weight Gain')}>Weight Gain</li>
                                <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Weight loss')}>Weight loss</li>
                            </ul>
                        </div>
                    )}
                </div>
               
                <input
                    type="text"
                    className=" w-full bg-transparent placeholder:text-white text-white text-sm border border-slate-200 rounded-md px-28 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                    placeholder="Trainer's......."
                />
                </div>
                <button
                    className="absolute top-1 right-1 flex items-center rounded bg-red-600 py-1 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-red-700 focus:shadow-none active:bg-red-700 hover:bg-red-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
                    </svg>
                    Search
                </button>
            </div>
        </div>
    );
};

export default SearchBar;