import { useStoreContext } from "../context/StoreContext";

export function useStore() {
  return useStoreContext();
}
