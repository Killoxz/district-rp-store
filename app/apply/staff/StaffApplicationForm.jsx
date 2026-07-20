'use client';

import { useRef, useState } from 'react';

const SCENARIOS = {
  discord_staff: [
    'A member is spamming inappropriate content in a public channel. Walk us through exactly what you’d do, step by step.',
    'Two members get into a heated argument in general chat and it starts to escalate. How do you de-escalate the situation?',
    'You receive a report that another staff member is abusing their permissions. What do you do?',
  ],
  ingame_mod: [
    'You witness a player repeatedly breaking FailRP rules during a roleplay scene. Walk us through exactly what you’d do, step by step.',
    'A player accuses another player of metagaming during an active scene. How do you handle it?',
    'You receive a report that another staff member is abusing their in-game moderation powers. What do you do?',
  ],
};

const STEP1_REQUIRED = ['role', 'discordUsername', 'email'];
const STEP2_REQUIRED = ['whyJoin'];
const STEP3_REQUIRED = ['scenario1', 'scenario2', 'scenario3'];

export default function StaffApplicationForm({ action }) {
  const formRef = useRef(null);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const scenarios = SCENARIOS[role] || SCENARIOS.discord_staff;

  function fieldsFilled(names) {
    if (!formRef.current) return true;
    return names.every((name) => formRef.current.elements[name]?.value?.trim());
  }

  function goNext(requiredNames) {
    if (!fieldsFilled(requiredNames)) {
      setError('Please fill in every required field before continuing.');
      return;
    }
    setError('');
    setStep((s) => s + 1);
  }

  function goBack() {
    setError('');
    setStep((s) => s - 1);
  }

  return (
    <form ref={formRef} action={action} className="application-form">
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Step {step} of 3</p>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="" disabled>Choose a role&hellip;</option>
            <option value="discord_staff">Discord Staff</option>
            <option value="ingame_mod">In-Game Moderator</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="discordUsername">Discord Username</label>
          <input id="discordUsername" name="discordUsername" type="text" />
        </div>

        <div className="field">
          <label htmlFor="email">Email Address</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" />
        </div>

        <div className="field">
          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" min="1" max="120" />
        </div>

        <div className="field">
          <label htmlFor="timezone">Timezone</label>
          <input id="timezone" name="timezone" type="text" placeholder="e.g. EST, GMT+1" />
        </div>

        <div className="field">
          <label htmlFor="availability">Weekly Availability</label>
          <input id="availability" name="availability" type="text" placeholder="e.g. Weekends, evenings EST" />
        </div>
      </div>

      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <div className="field">
          <label htmlFor="priorExperience">Prior Staff / Moderation Experience</label>
          <textarea id="priorExperience" name="priorExperience" rows={4} placeholder="Optional — any relevant past experience, here or elsewhere." />
        </div>

        <div className="field">
          <label htmlFor="whyJoin">Why do you want to join the team?</label>
          <textarea id="whyJoin" name="whyJoin" rows={5} />
        </div>

        <div className="field">
          <label htmlFor="strengths">What sets you apart from other applicants?</label>
          <textarea id="strengths" name="strengths" rows={4} />
        </div>

        <div className="field">
          <label htmlFor="hasMicrophone">Do you have a working microphone?</label>
          <select id="hasMicrophone" name="hasMicrophone" defaultValue="">
            <option value="" disabled>Choose one&hellip;</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div style={{ display: step === 3 ? 'block' : 'none' }}>
        <div className="field">
          <label htmlFor="scenario1">Scenario 1: {scenarios[0]}</label>
          <textarea id="scenario1" name="scenario1" rows={4} />
        </div>

        <div className="field">
          <label htmlFor="scenario2">Scenario 2: {scenarios[1]}</label>
          <textarea id="scenario2" name="scenario2" rows={4} />
        </div>

        <div className="field">
          <label htmlFor="scenario3">Scenario 3: {scenarios[2]}</label>
          <textarea id="scenario3" name="scenario3" rows={4} />
        </div>

        <div className="field">
          <label htmlFor="additionalInfo">Anything else you&rsquo;d like us to know?</label>
          <textarea id="additionalInfo" name="additionalInfo" rows={4} placeholder="Optional" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {step > 1 && (
          <button type="button" className="btn btn-outline" onClick={goBack}>Back</button>
        )}
        {step === 1 && (
          <button type="button" className="btn btn-primary" onClick={() => goNext(STEP1_REQUIRED)}>Next</button>
        )}
        {step === 2 && (
          <button type="button" className="btn btn-primary" onClick={() => goNext(STEP2_REQUIRED)}>Next</button>
        )}
        {step === 3 && (
          <button
            type="submit"
            className="btn btn-primary"
            onClick={(e) => {
              if (!fieldsFilled(STEP3_REQUIRED)) {
                e.preventDefault();
                setError('Please fill in every required field before submitting.');
              }
            }}
          >
            Submit Application
          </button>
        )}
      </div>
    </form>
  );
}
