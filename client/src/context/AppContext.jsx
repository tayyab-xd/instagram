import { createContext, useContext, useReducer } from "react";

const AppContext = createContext();

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    posts: [],
    loading: false,
    error: null,
};

// ---------------- REDUCER ----------------
const reducer = (state, action) => {
    switch (action.type) {
        case "LOADING":
            return { ...state, loading: true, error: null };

        case "SET_USER":
            console.log(action.payload);
            return {
                ...state,
                user: action.payload,
                token: action.payload.token,
                loading: false
            };

        case "LOGOUT":
            return { ...state, user: null, token: null };

        case "SET_POSTS":
            return { ...state, posts: action.payload, loading: false };

        case "ERROR":
            return { ...state, error: action.payload, loading: false };

        default:
            return state;
    }
};

// ---------------- PROVIDER ----------------
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook
export const useApp = () => useContext(AppContext);
