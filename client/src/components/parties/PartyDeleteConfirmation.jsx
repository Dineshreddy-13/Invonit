import React from "react";
import { AlertCircle } from "lucide-react";
import usePartiesStore from "../../store/partiesStore";
import useBusinessStore from "../../store/businessStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export default function PartyDeleteConfirmation({
  isOpen,
  party,
  onClose,
  onDeleteSuccess,
}) {
  const { business } = useBusinessStore();
  const { deleteParty, deleting, error } = usePartiesStore();

  const handleDelete = async () => {
    if (!business?.id || !party?.id) return;

    const result = await deleteParty(business.id, party.id);
    if (result.success) {
      onClose();
      onDeleteSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Party"
      description="This action cannot be undone."
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleting}
            onClick={handleDelete}
          >
            Delete Party
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{party?.name || "this party"}</strong>? 
          All associated data will be permanently removed.
        </p>
      </div>
    </Modal>
  );
}
