

export const RenderName: React.FC<{ depth?: number; name: string; }> = ({ depth = undefined, name }) => {
    return <span className="name">
        {depth == 0 ? "ROOT" : String(name)}
    </span>;
};
