import { useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '@store/index';

// Typed selector hook — har baar RootState likhna na pare
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default useAppSelector;