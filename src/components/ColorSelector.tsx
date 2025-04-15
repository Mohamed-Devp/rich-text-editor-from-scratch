import React, { useState } from "react";

interface Props {
    id: string
    label: string
    onSelect?: (color: string) => void
}

const ColorSelector: React.FC<Props> = ({ id, label, onSelect }) => {
    const [selected, setSelected] = useState<string>('#000');

    const selectColor = (color: string) => {
        setSelected(color);
        if (onSelect) onSelect(color);
    }

    return (
        <div className="color-selector">
            <label htmlFor={id}>{ label }</label>
            <input
                id={id}
                type="color"
                onChange={(event) => selectColor(event.target.value)}/>

            <div className="swatch" style={{backgroundColor: selected}}></div>
        </div>
    );
}

export default ColorSelector;