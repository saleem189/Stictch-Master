import { useEffect, useMemo, useState } from 'react';
import { DocumentData, onSnapshot, Query } from 'firebase/firestore';

export interface FirestoreQueryState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function useFirestoreQuery<T>(
  queryRef: Query<DocumentData> | null,
  mapDoc: (id: string, data: DocumentData) => T
): FirestoreQueryState<T> {
  const [state, setState] = useState<FirestoreQueryState<T>>({
    data: [],
    loading: Boolean(queryRef),
    error: null,
    fromCache: false,
    hasPendingWrites: false,
  });

  const stableState = useMemo(() => state, [state]);

  useEffect(() => {
    if (!queryRef) {
      setState({
        data: [],
        loading: false,
        error: null,
        fromCache: false,
        hasPendingWrites: false,
      });
      return;
    }

    setState(current => ({ ...current, loading: true, error: null }));

    return onSnapshot(
      queryRef,
      { includeMetadataChanges: true },
      snapshot => {
        setState({
          data: snapshot.docs.map(document => mapDoc(document.id, document.data())),
          loading: false,
          error: null,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
      error => {
        setState(current => ({
          ...current,
          loading: false,
          error,
        }));
      }
    );
  }, [queryRef, mapDoc]);

  return stableState;
}
