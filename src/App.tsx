import React from "react";

// Components
import Menu from "./components/Menu";
import Editor from "./components/Editor";

// Context
import { TextModelProvider } from "./context/TextModelCtx";

// Styles
import "./App.css";

const App: React.FC = () => {
	return (
		<div className="app">
			<TextModelProvider>
				<Menu />
				<Editor />
			</TextModelProvider>
		</div>
	);
}

export default App;