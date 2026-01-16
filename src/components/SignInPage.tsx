import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import logo from "../assets/logo.svg";
import { motion } from "framer-motion";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from "../firebase";

export default function SignInPage() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const isEmailValid = React.useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const canSubmit = React.useMemo(
    () =>
      !loading &&
      isEmailValid &&
      (mode === "signin" ? password.length > 0 : password.length >= 6),
    [loading, isEmailValid, mode, password],
  );

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      setShowSuccess(true);
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        p: 2,
        background:
          "linear-gradient(180deg,#071033 0%,#081026 35%,#071936 100%)",
      }}
    >
      {/* decorative floating shapes */}
      <motion.div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          right: -120,
          top: -60,
          zIndex: 0,
          filter: "blur(36px)",
          opacity: 0.75,
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      >
        <svg viewBox="0 0 600 600" width="100%" height="100%">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0" stopColor="#7b61ff" />
              <stop offset="1" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          <g transform="translate(300,300)">
            <path
              d="M120,-150C160,-110,180,-60,190,-10C200,40,200,90,170,130C140,170,90,190,40,200C-10,210,-60,200,-100,170C-140,140,-170,90,-180,30C-190,-30,-180,-90,-140,-130C-100,-170,-50,-190,0,-200C50,-210,100,-190,120,-150Z"
              fill="url(#g1)"
            />
          </g>
        </svg>
      </motion.div>

      <motion.div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          left: -80,
          bottom: -80,
          zIndex: 0,
          filter: "blur(20px)",
          opacity: 0.5,
        }}
        animate={{ y: [0, -18, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <defs>
            <radialGradient id="g2">
              <stop offset="0%" stopColor="#ff7ab6" />
              <stop offset="100%" stopColor="#ffd36b" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#g2)" />
        </svg>
      </motion.div>

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={12}
            sx={{
              width: { xs: "100%", sm: 640 },
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.06)",
              color: "white",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <img
                  src={logo}
                  alt="To-Do logo"
                  style={{ width: 44, height: 44, display: "block" }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  To‑Do
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.72)" }}
                >
                  Organize your day — beautifully.
                </Typography>
              </Box>
            </Box>

            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Box
              sx={{
                display: "flex",
                gap: 3,
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && canSubmit && submit()
                    }
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.9)" },
                    }}
                    inputProps={{
                      style: { color: "white" },
                      "aria-label": "email",
                    }}
                    helperText={
                      !isEmailValid && email ? "Enter a valid email" : ""
                    }
                    error={!isEmailValid && email.length > 0}
                    sx={{
                      mb: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                      borderRadius: 1,
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        boxShadow: "0 8px 30px rgba(123,97,255,0.14)",
                        borderColor: "rgba(123,97,255,0.9)",
                      },
                    }}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && canSubmit && submit()
                    }
                    InputLabelProps={{
                      style: { color: "rgba(255,255,255,0.9)" },
                    }}
                    inputProps={{
                      style: { color: "white" },
                      "aria-label": "password",
                    }}
                    helperText={
                      mode === "signup" && password && password.length < 6
                        ? "Password must be ≥ 6 characters"
                        : ""
                    }
                    error={
                      mode === "signup" && !!password && password.length < 6
                    }
                    sx={{
                      mb: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                      borderRadius: 1,
                      "& .MuiOutlinedInput-root.Mui-focused": {
                        boxShadow: "0 8px 30px rgba(0,212,255,0.12)",
                        borderColor: "rgba(0,212,255,0.9)",
                      },
                    }}
                  />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      fullWidth
                      size="large"
                      onClick={submit}
                      disabled={!canSubmit}
                      sx={{
                        py: 1.5,
                        fontWeight: 700,
                        background: "linear-gradient(90deg,#7b61ff,#00d4ff)",
                        color: "white",
                        boxShadow: "0 8px 28px rgba(0,0,0,0.24)",
                        "&:hover": { filter: "brightness(1.05)" },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : mode === "signin" ? (
                        "Sign in"
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </motion.div>

                  <Box sx={{ textAlign: "center", mt: 1 }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {mode === "signin"
                        ? "Don't have an account?"
                        : "Already have an account?"}
                    </Typography>
                    <Button
                      onClick={() =>
                        setMode(mode === "signin" ? "signup" : "signin")
                      }
                      sx={{ ml: 1, color: "white" }}
                    >
                      {mode === "signin" ? "Create one" : "Sign in"}
                    </Button>
                  </Box>
                </motion.div>
              </Box>

              <Box sx={{ width: { xs: "100%", md: 320 } }}>
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1, color: "white", fontWeight: 700 }}
                    >
                      Quick sign in
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={google}
                      disabled={loading}
                      sx={{
                        mb: 1,
                        color: "white",
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Continue with Google"
                      )}
                    </Button>
                    <Divider
                      sx={{ borderColor: "rgba(255,255,255,0.06)", my: 1 }}
                    >
                      or
                    </Divider>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.72)" }}
                    >
                      Sign in to sync your tasks with the cloud and access them
                      across devices.
                    </Typography>
                  </Paper>
                </motion.div>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>
      <Snackbar
        open={showSuccess}
        autoHideDuration={2500}
        onClose={() => setShowSuccess(false)}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Signed in successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}
