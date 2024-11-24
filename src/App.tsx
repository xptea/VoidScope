import "./main.css";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
	const [greetMsg, setGreetMsg] = useState("");
	const [name, setName] = useState("");

	async function greet() {
		setGreetMsg(await invoke("greet", { name }));
	}

	return (
		<main className="w-screen flex flex-col justify-center text-center m-0 pt-16 gap-2">
			<h1 className="text-3xl font-bold">Welcome to Tauri + React + TailwindCSS</h1>

			<div className="m-8">
				<div className="flex gap-12 justify-center mb-5">
					<a href="https://tauri.app" target="_blank" className="logo-link">
						<img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
					</a>
					<a href="https://reactjs.org" target="_blank" className="logo-link">
						<img src={"/react.svg"} className="logo react" alt="React logo" />
					</a>
					<a href="https://tailwindcss.com/" target="_blank" className="logo-link">
						<img src="/tailwind.svg" className="logo tailwind" alt="TailwindCSS logo" />
					</a>
				</div>
				<p>Click on a logo to learn more.</p>
			</div>

			<form
				className="flex justify-center gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					greet();
				}}
			>
				<input
					onChange={(e) => setName(e.currentTarget.value)}
					placeholder="Enter a name..."
					className="bg-neutral-900 py-3 px-4 w-64 rounded-md outline-none"
				/>
				<button className="bg-neutral-900 px-6 py-2 rounded-md" type="submit">
					Greet
				</button>
			</form>
			<p>{greetMsg}</p>
		</main>
	);
}

export default App;
