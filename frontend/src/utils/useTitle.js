import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = `Hallmark Manager | ${title}`;
  }, [title]);
}

export default useTitle;
