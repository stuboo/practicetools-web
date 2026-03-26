import { describe, it, expect } from 'vitest';
import { pathwayReducer, initialState, renumberSteps } from './index';
import { Step } from './types';

describe('renumberSteps', () => {
  it('assigns sequential numbers starting from 1', () => {
    const steps: Step[] = [
      { treatmentId: 'a', sequence: 5 },
      { treatmentId: 'b', sequence: 10 },
      { treatmentId: 'c', sequence: 3 },
    ];
    const result = renumberSteps(steps);
    expect(result.map(s => s.sequence)).toEqual([1, 2, 3]);
  });

  it('preserves other step properties', () => {
    const steps: Step[] = [
      { treatmentId: 'a', sequence: 99, dose: '10mg', notes: 'note' },
    ];
    const result = renumberSteps(steps);
    expect(result[0]).toEqual({ treatmentId: 'a', sequence: 1, dose: '10mg', notes: 'note' });
  });

  it('handles empty array', () => {
    expect(renumberSteps([])).toEqual([]);
  });
});

describe('pathwayReducer', () => {
  describe('addStep', () => {
    it('adds a step with correct sequence number', () => {
      const state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      expect(state.steps).toHaveLength(1);
      expect(state.steps[0].treatmentId).toBe('oab-bladder-diary');
      expect(state.steps[0].sequence).toBe(1);
    });

    it('assigns incrementing sequence numbers', () => {
      let state = initialState;
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-vibegron-75mg' });
      expect(state.steps.map(s => s.sequence)).toEqual([1, 2, 3]);
    });

    it('pre-fills duration from catalog', () => {
      const state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      expect(state.steps[0].duration).toBe('2 weeks');
    });

    it('pre-fills first dose option for medication treatments', () => {
      const state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-vibegron-75mg' });
      expect(state.steps[0].dose).toBe('75 mg daily');
    });

    it('does not pre-fill dose for behavioral treatments', () => {
      const state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      expect(state.steps[0].dose).toBeUndefined();
    });

    it('prevents duplicate treatment IDs', () => {
      let state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      expect(state.steps).toHaveLength(1);
    });

    it('ignores unknown treatment IDs', () => {
      const state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'nonexistent' });
      expect(state.steps).toHaveLength(0);
    });
  });

  describe('removeStep', () => {
    it('removes a step and renumbers remaining', () => {
      let state = initialState;
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-vibegron-75mg' });

      state = pathwayReducer(state, { type: 'removeStep', treatmentId: 'oab-timed-voiding' });

      expect(state.steps).toHaveLength(2);
      expect(state.steps[0].treatmentId).toBe('oab-bladder-diary');
      expect(state.steps[0].sequence).toBe(1);
      expect(state.steps[1].treatmentId).toBe('oab-vibegron-75mg');
      expect(state.steps[1].sequence).toBe(2);
    });

    it('handles removing last step', () => {
      let state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'removeStep', treatmentId: 'oab-bladder-diary' });
      expect(state.steps).toHaveLength(0);
    });
  });

  describe('reorderStep', () => {
    it('reorders and renumbers all sequences', () => {
      let state = initialState;
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-vibegron-75mg' });

      // Move last item to first position
      state = pathwayReducer(state, { type: 'reorderStep', fromIndex: 2, toIndex: 0 });

      expect(state.steps[0].treatmentId).toBe('oab-vibegron-75mg');
      expect(state.steps[1].treatmentId).toBe('oab-bladder-diary');
      expect(state.steps[2].treatmentId).toBe('oab-timed-voiding');
      expect(state.steps.map(s => s.sequence)).toEqual([1, 2, 3]);
    });

    it('moving first to last renumbers correctly', () => {
      let state = initialState;
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });

      state = pathwayReducer(state, { type: 'reorderStep', fromIndex: 0, toIndex: 1 });

      expect(state.steps[0].treatmentId).toBe('oab-timed-voiding');
      expect(state.steps[1].treatmentId).toBe('oab-bladder-diary');
      expect(state.steps.map(s => s.sequence)).toEqual([1, 2]);
    });
  });

  describe('updateStep', () => {
    it('updates step fields without changing sequence', () => {
      let state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, {
        type: 'updateStep',
        treatmentId: 'oab-bladder-diary',
        updates: { notes: 'Patient note', duration: '4 weeks' },
      });

      expect(state.steps[0].notes).toBe('Patient note');
      expect(state.steps[0].duration).toBe('4 weeks');
      expect(state.steps[0].sequence).toBe(1);
    });

    it('does not affect other steps', () => {
      let state = initialState;
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });
      state = pathwayReducer(state, {
        type: 'updateStep',
        treatmentId: 'oab-bladder-diary',
        updates: { notes: 'Updated' },
      });

      expect(state.steps[0].notes).toBe('Updated');
      expect(state.steps[1].notes).toBeUndefined();
    });
  });

  describe('addExclusion', () => {
    it('adds an exclusion and removes the treatment from steps', () => {
      let state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, { type: 'addStep', treatmentId: 'oab-timed-voiding' });

      state = pathwayReducer(state, {
        type: 'addExclusion',
        treatmentId: 'oab-bladder-diary',
        reason: 'Not appropriate',
      });

      expect(state.exclusions).toHaveLength(1);
      expect(state.exclusions[0].treatmentId).toBe('oab-bladder-diary');
      expect(state.exclusions[0].reason).toBe('Not appropriate');
      // Step should be removed
      expect(state.steps).toHaveLength(1);
      expect(state.steps[0].treatmentId).toBe('oab-timed-voiding');
      expect(state.steps[0].sequence).toBe(1); // renumbered
    });

    it('prevents duplicate exclusions', () => {
      let state = pathwayReducer(initialState, {
        type: 'addExclusion',
        treatmentId: 'oab-botox',
        reason: 'Declined',
      });
      state = pathwayReducer(state, {
        type: 'addExclusion',
        treatmentId: 'oab-botox',
        reason: 'Another reason',
      });
      expect(state.exclusions).toHaveLength(1);
    });
  });

  describe('removeExclusion', () => {
    it('removes an exclusion', () => {
      let state = pathwayReducer(initialState, {
        type: 'addExclusion',
        treatmentId: 'oab-botox',
        reason: 'Declined',
      });
      state = pathwayReducer(state, { type: 'removeExclusion', treatmentId: 'oab-botox' });
      expect(state.exclusions).toHaveLength(0);
    });
  });

  describe('loadPathway', () => {
    it('replaces entire state', () => {
      const pathway = {
        conditionId: 'oab',
        steps: [{ treatmentId: 'oab-bladder-diary', sequence: 1 }],
        exclusions: [{ treatmentId: 'oab-botox', reason: 'Declined' }],
        key: 'TESTKEY',
        createdAt: '2026-03-20',
        updatedAt: '2026-03-25',
      };
      const state = pathwayReducer(initialState, { type: 'loadPathway', pathway });
      expect(state.key).toBe('TESTKEY');
      expect(state.steps).toEqual(pathway.steps);
      expect(state.exclusions).toEqual(pathway.exclusions);
      expect(state.createdAt).toBe('2026-03-20');
    });
  });

  describe('setSaved', () => {
    it('sets key and timestamps without replacing steps', () => {
      let state = pathwayReducer(initialState, { type: 'addStep', treatmentId: 'oab-bladder-diary' });
      state = pathwayReducer(state, {
        type: 'setSaved',
        key: 'NEW-KEY',
        createdAt: '2026-03-25',
        updatedAt: '2026-03-25',
      });
      expect(state.key).toBe('NEW-KEY');
      expect(state.steps).toHaveLength(1);
      expect(state.createdAt).toBe('2026-03-25');
    });
  });
});
