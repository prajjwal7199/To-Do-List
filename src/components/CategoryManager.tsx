import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../redux/store";
import type { Category } from "../types";
import {
  addCategory,
  editCategory,
  deleteCategory,
} from "../redux/slices/tasksSlice";

export default function CategoryManager() {
  const categories = useSelector(
    (s: RootState) => (s.tasks as any).categories as Category[],
  );
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const handleSave = () => {
    if (!name.trim()) return;

    if (editingId) {
      dispatch(editCategory({ id: editingId, name, color }));
    } else {
      dispatch(addCategory({ name, color }));
    }

    setOpen(false);
    setName("");
    setColor("#3b82f6");
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    const cat = categories.find((c: Category) => c.id === id);
    if (cat) {
      setName(cat.name);
      setColor(cat.color);
      setEditingId(id);
      setOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm("Delete this category? It will be removed from all tasks.")
    ) {
      dispatch(deleteCategory(id));
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Categories</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          variant="outlined"
          size="small"
        >
          Add Category
        </Button>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {categories.map((cat: Category) => (
          <Chip
            key={cat.id}
            label={cat.name}
            sx={{ bgcolor: cat.color, color: "white", mb: 1 }}
            onDelete={() => handleDelete(cat.id)}
            deleteIcon={<DeleteIcon sx={{ color: "white !important" }} />}
            onClick={() => handleEdit(cat.id)}
          />
        ))}
      </Stack>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setName("");
          setColor("#3b82f6");
        }}
      >
        <DialogTitle>
          {editingId ? "Edit Category" : "Add Category"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              minWidth: 300,
            }}
          >
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <Box>
              <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                Color
              </Typography>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditingId(null);
              setName("");
              setColor("#3b82f6");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
