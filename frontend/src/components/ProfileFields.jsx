import { Field, PhotoField, SelectField, TextField } from './ui.jsx';

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => ({ value: b, label: b }));

export function AccountFields({ values, onChange, errors, withAccount }) {
  const p = { values, onChange, errors };
  return (
    <>
      {withAccount && <TextField label="Username" name="username" autoComplete="username" required {...p} />}
      <div className="row">
        <div className="col-md-6"><TextField label="First name" name="first_name" required {...p} /></div>
        <div className="col-md-6"><TextField label="Last name" name="last_name" required {...p} /></div>
      </div>
      <TextField label="Email" name="email" type="email" required {...p} />
      {withAccount && (
        <TextField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required {...p} />
      )}
    </>
  );
}

export function DoctorFields({ values, onChange, errors, onPhoto, currentPhoto }) {
  const p = { values, onChange, errors };
  return (
    <>
      <TextField label="Department" name="department" required {...p} />
      <TextField label="Phone" name="phone" maxLength={15} {...p} />
      <Field label="Education" error={errors.education}>
        <textarea
          className={`form-control ${errors.education ? 'is-invalid' : ''}`}
          name="education"
          rows={3}
          value={values.education ?? ''}
          onChange={onChange}
          required
        />
      </Field>
      <PhotoField onChange={onPhoto} errors={errors} current={currentPhoto} />
    </>
  );
}

export function PatientFields({ values, onChange, errors, onPhoto, currentPhoto }) {
  const p = { values, onChange, errors };
  return (
    <>
      <div className="row">
        <div className="col-md-6"><SelectField label="Gender" name="gender" options={GENDERS} {...p} /></div>
        <div className="col-md-6">
          <TextField label="Date of birth" name="date_of_birth" type="date" max={new Date().toISOString().slice(0, 10)} required {...p} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6"><TextField label="Phone" name="phone" maxLength={15} required {...p} /></div>
        <div className="col-md-6"><SelectField label="Blood group" name="blood_group" placeholder="Select…" options={BLOOD_GROUPS} {...p} /></div>
      </div>
      <PhotoField onChange={onPhoto} errors={errors} current={currentPhoto} />
    </>
  );
}
