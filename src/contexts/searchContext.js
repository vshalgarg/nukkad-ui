import React, { createContext, useState } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [queryInput, setQueryInput] = useState('');

  return (
    <SearchContext.Provider value={{ queryInput, setQueryInput }}>
      {children}
    </SearchContext.Provider>
  );
};
