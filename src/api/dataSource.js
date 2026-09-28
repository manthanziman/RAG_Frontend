import { useEffect } from 'react';
import { useDispatch } from 'react-redux';


export const useLoadingHandler = (loading) => {
    const dispatch = useDispatch();
    useEffect(() => {
    loading
    ? dispatch(startLoading())
    : dispatch(stopLoading());
    }, [dispatch, loading]);
};