import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ForceRefreshOnBack() {
  const location = useLocation();

  useEffect(() => {
    // Whenever user presses back/forward, reload the page
    window.onpopstate = () => {
      window.location.reload();
    };

    return () => {
      window.onpopstate = null; // cleanup
    };
  }, [location]);

  return null;
}

export default ForceRefreshOnBack;
