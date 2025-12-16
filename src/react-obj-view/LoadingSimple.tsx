import { useState, useEffect } from "react";

export const LoadingSimple = ({ active = true }) => {

    let [t, setT] = useState(0);

    useEffect(() => {
        if (active) {
            let i = setInterval(
                () => setT(t => (t + 1) % 10),
                100
            );
            return () => clearInterval(i);
        }
    }, [active]);


    return <>{`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`.charAt(t)}</>
};
