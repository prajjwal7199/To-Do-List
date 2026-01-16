import React from "react";
import {
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
} from "../firebase";

export default function AuthButton() {
  const [user, setUser] = React.useState<User | null>(auth.currentUser);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  const [showEmail, setShowEmail] = React.useState<null | "signup" | "signin">(
    null,
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openSnack, setOpenSnack] = React.useState(false);

  const submitEmail = async () => {
    setLoading(true);
    try {
      if (showEmail === "signup") await signUpWithEmail(email, password);
      else if (showEmail === "signin") await signInWithEmail(email, password);
      setShowEmail(null);
    } catch (e: any) {
      setError(e?.message || "Authentication error");
      setOpenSnack(true);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
              } catch (e: any) {
                setError(e?.message || "Google sign-in failed");
                setOpenSnack(true);
              } finally {
                setLoading(false);
              }
            }}
            startIcon={
              loading ? <CircularProgress color="inherit" size={16} /> : null
            }
            disabled={loading}
            variant="contained"
            sx={{
              background: "linear-gradient(90deg,#7b61ff,#00d4ff)",
              color: "white",
              "&:hover": { filter: "brightness(1.05)" },
            }}
          >
            Sign in with Google
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowEmail("signin")}
            disabled={loading}
          >
            Sign in
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => setShowEmail("signup")}
            disabled={loading}
          >
            Create account
          </Button>
        </Box>

        <Dialog
          open={!!showEmail}
          onClose={() => setShowEmail(null)}
          PaperProps={{
            sx: {
              bgcolor: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(6px)",
            },
          }}
        >
          <DialogTitle sx={{ color: "text.primary" }}>
            {showEmail === "signup" ? "Create account" : "Sign in"}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEmail(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={submitEmail}
              disabled={loading}
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#7b61ff,#00d4ff)",
                color: "white",
              }}
            >
              {loading ? (
                <CircularProgress size={16} />
              ) : showEmail === "signup" ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={openSnack}
          autoHideDuration={6000}
          onClose={() => setOpenSnack(false)}
        >
          <Alert
            onClose={() => setOpenSnack(false)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  }

  const nameOrEmail = user.displayName || user.email || "User";

  return (
    <>
      <Button
        onClick={openMenu}
        startIcon={
          user.photoURL ? (
            <Avatar src={user.photoURL} />
          ) : (
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {(nameOrEmail || "U").charAt(0).toUpperCase()}
            </Avatar>
          )
        }
        variant="text"
        sx={{ color: "text.primary" }}
      >
        <Typography variant="button" sx={{ textTransform: "none" }}>
          {nameOrEmail}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={closeMenu}
        PaperProps={{ sx: { bgcolor: "rgba(255,255,255,0.03)" } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            signOutUser();
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
