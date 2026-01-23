import { SignUp } from "@clerk/clerk-react";
import { TronBackground, Container, Logo } from "../components";
import { Link } from "react-router-dom";
import "./Auth.css";

export function Signup() {
  return (
    <div className="auth-page">
      <TronBackground showGrid showAmbient />

      <Container size="sm">
        <div className="auth-container">
          <Link to="/" className="auth-logo">
            <Logo size="lg" />
          </Link>

          <div className="auth-card">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/login"
              afterSignUpUrl="/lobby"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                  },
                  card: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                },
              }}
            />
          </div>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
