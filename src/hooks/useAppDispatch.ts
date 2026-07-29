import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@store/index';

// Typed dispatch hook — `any` se bachne ke liye
const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export default useAppDispatch;