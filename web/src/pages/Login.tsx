import { SignIn } from "@clerk/clerk-react";
import { TronBackground, Container, Logo } from "../components";
import { Link } from "react-router-dom";
import "./Auth.css";

export function Login() {
  return (
    <div className="auth-page">
      <TronBackground showGrid showAmbient />

      <Container size="sm">
        <div className="auth-container">
          <Link to="/" className="auth-logo">
            <Logo size="lg" />
          </Link>

          <div className="auth-card">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              afterSignInUrl="/lobby"
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
            Don't have an account?{" "}
            <Link to="/signup" className="text-cyan">
              Sign up
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
