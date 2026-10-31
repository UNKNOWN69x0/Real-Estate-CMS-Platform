import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title}>
      <p className="text-sm text-brown-800">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
