import { RouterProvider } from 'react-router';
import { generateRouter } from './routes';
import '../styles/devtools-theme.css';
import "./ToolLoader"
import { useEffect, useState } from 'react';
import { loadTools } from './ToolLoader';

export default function App() {
  const [ready, setReady] = useState(false);

    useEffect(() => {
        async function init() {
            await loadTools();
            setReady(true);
            console.log("All tools loaded")
        }

        init();
    }, []);

    if (!ready) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem"
                }}
            >
                Loading tools...
            </div>
        );
    }

  return <RouterProvider router={generateRouter()} />;
}
