import React from 'react'
import { Button, Avatar, Menu, MenuItem, Box, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Snackbar, Alert, CircularProgress } from '@mui/material'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { signInWithGoogle, signUpWithEmail, signInWithEmail, signOutUser } from '../firebase'

export default function AuthButton() {
  const [user, setUser] = React.useState<User | null>(auth.currentUser)
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null)

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const closeMenu = () => setAnchor(null)

  const [showEmail, setShowEmail] = React.useState<null | 'signup' | 'signin'>(null)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [openSnack, setOpenSnack] = React.useState(false)

  const submitEmail = async () => {
    setLoading(true)
    try {
      if (showEmail === 'signup') await signUpWithEmail(email, password)
      else if (showEmail === 'signin') await signInWithEmail(email, password)
      setShowEmail(null)
    } catch (e: any) {
      setError(e?.message || 'Authentication error')
      setOpenSnack(true)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" onClick={async () => { setLoading(true); try { await signInWithGoogle() } catch (e:any) { setError(e?.message || 'Google sign-in failed'); setOpenSnack(true) } finally { setLoading(false) } }} startIcon={loading ? <CircularProgress color="inherit" size={16} /> : null} disabled={loading}>Sign in with Google</Button>
          <Button color="inherit" onClick={() => setShowEmail('signin')} disabled={loading}>Sign in with Email</Button>
          <Button color="inherit" onClick={() => setShowEmail('signup')} disabled={loading}>Sign up</Button>
        </Box>

        <Dialog open={!!showEmail} onClose={() => setShowEmail(null)}>
          <DialogTitle>{showEmail === 'signup' ? 'Sign up' : 'Sign in'}</DialogTitle>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField margin="dense" label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEmail(null)} disabled={loading}>Cancel</Button>
            <Button onClick={submitEmail} disabled={loading}>{loading ? <CircularProgress size={16} /> : (showEmail === 'signup' ? 'Create account' : 'Sign in')}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={openSnack} autoHideDuration={6000} onClose={() => setOpenSnack(false)}>
          <Alert onClose={() => setOpenSnack(false)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </>
    )
  }

  const nameOrEmail = user.displayName || user.email || 'User'

  return (
    <>
      <Button
        color="inherit"
        onClick={openMenu}
        startIcon={user.photoURL ? <Avatar src={user.photoURL} /> : <Avatar>{(nameOrEmail || 'U').charAt(0).toUpperCase()}</Avatar>}
      >
        <Typography variant="button" sx={{ textTransform: 'none' }}>{nameOrEmail}</Typography>
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
        <MenuItem onClick={() => { closeMenu(); signOutUser() }}>Sign out</MenuItem>
      </Menu>
    </>
  )
}
