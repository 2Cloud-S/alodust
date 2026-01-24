import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Button } from "../Button";
import { Card } from "../Card";
import { Input } from "../Input";
import "./ManageGroupsModal.css";

interface ManageGroupsModalProps {
  userId: string;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "Cyan", value: "#00FFFF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Orange", value: "#FF4D00" },
  { name: "Green", value: "#39FF14" },
  { name: "Purple", value: "#9D00FF" },
];

const PRESET_ICONS = ["🎮", "🎬", "🎵", "💬", "🎨", "⚡", "🌟", "🔥", "💎", "🎯"];

export function ManageGroupsModal({ userId, onClose }: ManageGroupsModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);

  const groups = useQuery(api.friendGroups.listGroups, { userId: userId as any });
  const createGroup = useMutation(api.friendGroups.createGroup);
  const updateGroup = useMutation(api.friendGroups.updateGroup);
  const deleteGroup = useMutation(api.friendGroups.deleteGroup);

  const handleCreate = async () => {
    if (!groupName.trim()) return;

    try {
      await createGroup({
        userId: userId as any,
        name: groupName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });

      // Reset form
      setGroupName("");
      setSelectedColor(PRESET_COLORS[0].value);
      setSelectedIcon(PRESET_ICONS[0]);
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleUpdate = async (groupId: string) => {
    if (!groupName.trim()) return;

    try {
      await updateGroup({
        groupId: groupId as any,
        userId: userId as any,
        name: groupName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });

      // Reset form
      setEditingGroupId(null);
      setGroupName("");
      setSelectedColor(PRESET_COLORS[0].value);
      setSelectedIcon(PRESET_ICONS[0]);
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Delete this group? Friends will not be removed.")) return;

    try {
      await deleteGroup({
        groupId: groupId as any,
        userId: userId as any,
      });
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const startEdit = (group: any) => {
    setEditingGroupId(group._id);
    setGroupName(group.name);
    setSelectedColor(group.color);
    setSelectedIcon(group.icon || PRESET_ICONS[0]);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setIsCreating(false);
    setGroupName("");
    setSelectedColor(PRESET_COLORS[0].value);
    setSelectedIcon(PRESET_ICONS[0]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content manage-groups-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="modal-header">
          <h2>Manage Friend Groups</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Create/Edit Form */}
          <AnimatePresence>
            {(isCreating || editingGroupId) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="group-form"
              >
                <Card glowColor="cyan">
                  <h3>{editingGroupId ? "Edit Group" : "Create New Group"}</h3>

                  <Input
                    label="Group Name"
                    placeholder="e.g., Gaming Friends"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                  />

                  {/* Color Picker */}
                  <div className="form-section">
                    <label className="form-label">Color</label>
                    <div className="color-picker">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`color-option ${
                            selectedColor === color.value ? "selected" : ""
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColor(color.value)}
                          title={color.name}
                        >
                          {selectedColor === color.value && "✓"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div className="form-section">
                    <label className="form-label">Icon</label>
                    <div className="icon-picker">
                      {PRESET_ICONS.map((icon) => (
                        <button
                          key={icon}
                          className={`icon-option ${
                            selectedIcon === icon ? "selected" : ""
                          }`}
                          onClick={() => setSelectedIcon(icon)}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        editingGroupId
                          ? handleUpdate(editingGroupId)
                          : handleCreate()
                      }
                      disabled={!groupName.trim()}
                    >
                      {editingGroupId ? "Update" : "Create"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCreating && !editingGroupId && (
            <Button
              onClick={() => setIsCreating(true)}
              className="create-group-btn"
            >
              + Create New Group
            </Button>
          )}

          {/* Existing Groups */}
          <div className="groups-list">
            {groups && groups.length > 0 ? (
              <AnimatePresence>
                {groups.map((group) => (
                  <motion.div
                    key={group._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="group-item" glowColor="cyan">
                      <div className="group-item-header">
                        <div className="group-item-info">
                          <span
                            className="group-item-icon"
                            style={{ color: group.color }}
                          >
                            {group.icon || "📁"}
                          </span>
                          <div>
                            <h4 className="group-item-name">{group.name}</h4>
                            <p className="group-item-count">
                              {group.members.length} member
                              {group.members.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="group-item-actions">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(group)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="delete-btn"
                            onClick={() => handleDelete(group._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="empty-state">
                <p>No groups yet</p>
                <p className="subtle">Create a group to organize your friends!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
