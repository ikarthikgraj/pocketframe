const steps = ["Setup", "Voice", "Shots", "Export"];
export function WorkspaceStepper() { return <nav className="stepper" aria-label="Production steps">{steps.map((step, index) => <span className={index === 0 ? "current" : ""} key={step}>{index + 1}. {step}</span>)}</nav>; }
