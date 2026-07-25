const steps = ["Setup", "Voice", "Shots", "Export"];
export function WorkspaceStepper({ current = "Setup" }: { current?: string }) { return <nav className="stepper" aria-label="Production steps">{steps.map((step, index) => <span className={step === current ? "current" : ""} key={step}>{index + 1}. {step}</span>)}</nav>; }
