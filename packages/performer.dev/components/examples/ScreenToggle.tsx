import React from "react";

// Optional: define your styles as a JavaScript object if you prefer inline styles
// Alternatively, you can use a separate CSS/SCSS file for styling.

const styles = {
  toggle: {
    position: "fixed",
    bottom: "var(--sk-nav-height)", // Ensure these CSS variables are defined or replace them with specific values
    width: "100%",
    height: "4.6rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderTop: "1px solid var(--sk-theme-2)",
    backgroundColor: "var(--sk-back-4)",
  },
  button: {
    margin: "0 0.15em",
    width: "4em",
    height: "1em",
    padding: "0.3em 0.4em",
    borderRadius: "var(--sk-border-radius)",
    lineHeight: "1em",
    boxSizing: "content-box",
    color: "var(--sk-text-3)",
    border: "1px solid var(--sk-back-3)",
  },
  selected: {
    backgroundColor: "var(--sk-theme-1)",
    color: "white",
  },
};

const ScreenToggle = ({ labels, offset, setOffset }) => {
  return (
    // @ts-ignore
    <div className="toggle" style={styles.toggle}>
      {labels.map((label, index) => (
        <button
          key={index}
          // @ts-ignore
          style={{
            ...styles.button,
            ...(offset === index ? styles.selected : {}),
          }}
          onClick={() => setOffset(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default ScreenToggle;
