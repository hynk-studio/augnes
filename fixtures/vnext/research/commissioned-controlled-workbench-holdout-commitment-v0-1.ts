import type { CommissionedWorkCaseCommitmentV01 } from "@/types/vnext/commissioned-controlled-workbench";

/**
 * Frozen opaque holdout commitment for the merged CW1 family. This contains
 * no holdout source prose, repository contents, expected writes, or oracle
 * programs. Training-only owners import only this commitment and therefore do
 * not construct the holdout source.
 */
export const COMMISSIONED_WORKBENCH_HOLDOUT_COMMITMENT_V01 = {
  "commitment_version": "commissioned_controlled_work_case_commitment.v0.1",
  "case_id": "case-quartz-83",
  "case_role": "holdout",
  "project_id": "project-quartz-83",
  "independent_origin_group_id": "origin-quartz-ledger",
  "repository_fixture_fingerprint": "sha256:8aa89faf581960126d1a934fe7a417725e4fb0221fa9c14d6766a91c6fb04fe5",
  "initial_source_fingerprint": "sha256:5a5ea2e5ff823242c0d4923307e728ef234bf5a1e999293527b6863f071e8c07",
  "task_fingerprint": "sha256:880b1eca46071bb37d40de33a75fbc2c183bda7b5d9fec443675393145570575",
  "common_evidence_fingerprint": "sha256:845828a73fe84e3ad4a7424e62eb463c3b32b80551514f79ebafc59b248aa717",
  "source_drift_fingerprint": "sha256:06ce7d7a639e79c50754cf5423f185130a13d7680107f1075c9778663a32b8cb",
  "expected_current_source_fingerprint": "sha256:eced8c80550ad6657a07d911445294f28f7437c8a0b8fff86531679a83585f7c",
  "source_currentness_check_id": "quartz-shape-contract",
  "evaluator_rubric_fingerprint": "sha256:31c4b2429a95f4ab46de1f140491f2dd578a7b793788644e58cfc24c3e7b2ce3",
  "objective_oracle_fingerprint": "sha256:cbf39b9cfacb0855d287dcf9fcc786fe3b8882828a2644fc9fc050cebbbed160",
  "expected_success_diff_fingerprint": "sha256:14f61767ccf8e78d11586dae9dc28214fcaaff3aebbee14b2b2e0a1dab56db4b",
  "hard_failure_set_fingerprint": "sha256:2fe44713cb04ffb919ed66bf97a1a8a608f271b8e70470586646f6c70cfd8f28",
  "condition_assignment_fingerprint": "sha256:83492e02f6ac4522edc566a8bcbca78440e1d81032edc221c5f02b598a2426dc",
  "holdout_plan_fingerprint": "sha256:90ff5b6fb09656e566f20983cde7d060f330c13426c030ad1876a69b5b967d7f",
  "repository_path_set_fingerprint": "sha256:6563c2ba4275a75bdee9abb59a14a6062f66f06eaf824f98c4bcd61636dfd849",
  "operation_shape_fingerprint": "sha256:cfd5306ad2ceb110f35260c6ff3e8c47c49b569dbd80ba57a8eab8d329cb6fb6",
  "episode_plan_set_fingerprint": "sha256:aa24f33e7f8f23e30f949c40462089598d037aaac7640a325a2fa36dac5576be",
  "required_check_ids": [
    "quartz-edge-contract",
    "quartz-shape-contract"
  ],
  "negative_space_guard_refs": [
    {
      "material_kind": "evaluator_rubric",
      "opaque_id": "opaque:f497180e35e70fb7c76c0920cf96e88c",
      "content_fingerprint": "sha256:f497180e35e70fb7c76c0920cf96e88c954c568fc438fee029c48390ae17400e",
      "lifecycle_status": "retracted"
    }
  ],
  "condition_bindings": [
    {
      "condition": "exact_current_continuity",
      "holdout_variant": "strongest_equal_budget_baseline",
      "existing_reentry_role": "exact_reentry",
      "common_evidence_fingerprint": "sha256:845828a73fe84e3ad4a7424e62eb463c3b32b80551514f79ebafc59b248aa717",
      "continuation_material_refs": [
        {
          "material_kind": "excluded_or_ablated_material",
          "opaque_id": "opaque:0bb15512080f5c224fc8fc82f7b423e6",
          "content_fingerprint": "sha256:0bb15512080f5c224fc8fc82f7b423e6d0c9a1ee643439f7faf7f481626cf75f",
          "lifecycle_status": "retracted"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:1d17fe3e1c8ec8f8b3cfa474f23cc78a",
          "content_fingerprint": "sha256:1d17fe3e1c8ec8f8b3cfa474f23cc78aedd2da834db563f7f808a09c9b7e39a5",
          "lifecycle_status": "current"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:81dfb6e6181819b2b6fff4f87c3c4d5a",
          "content_fingerprint": "sha256:81dfb6e6181819b2b6fff4f87c3c4d5a557e1d8a0c0b873051782c4230e3992c",
          "lifecycle_status": "incomplete"
        }
      ],
      "excluded_material_refs": [
        {
          "material_kind": "stale_relation",
          "opaque_id": "opaque:6d2ba4238b3868ad71df7e78a94d19cb",
          "content_fingerprint": "sha256:6d2ba4238b3868ad71df7e78a94d19cb625751e92635cdebfdc9dfab2ca18130",
          "lifecycle_status": "stale"
        }
      ],
      "stale_relation_ref": null,
      "intervention_provenance_ref": {
        "material_kind": "intervention_provenance",
        "opaque_id": "opaque:2e536ab96595b23dac631a616eafd002",
        "content_fingerprint": "sha256:2e536ab96595b23dac631a616eafd0020098f9d80a58d33e4f7a5bc891fe472a",
        "lifecycle_status": "current"
      },
      "candidate_intervention_mode": "no_candidate",
      "candidate_component_refs": [],
      "candidate_assignment_fingerprint": "sha256:3e7649757297eb6c1868613824e6c6a18bdee731043294e5a7fa9c3991b1e499",
      "binding_fingerprint": "sha256:42c280699c0a71ea4e0138935ddeb89e9bf15fdf1c32dec9386e2ce49bc44950"
    },
    {
      "condition": "exact_current_continuity",
      "holdout_variant": "candidate_present",
      "existing_reentry_role": "exact_reentry",
      "common_evidence_fingerprint": "sha256:845828a73fe84e3ad4a7424e62eb463c3b32b80551514f79ebafc59b248aa717",
      "continuation_material_refs": [
        {
          "material_kind": "excluded_or_ablated_material",
          "opaque_id": "opaque:0bb15512080f5c224fc8fc82f7b423e6",
          "content_fingerprint": "sha256:0bb15512080f5c224fc8fc82f7b423e6d0c9a1ee643439f7faf7f481626cf75f",
          "lifecycle_status": "retracted"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:1d17fe3e1c8ec8f8b3cfa474f23cc78a",
          "content_fingerprint": "sha256:1d17fe3e1c8ec8f8b3cfa474f23cc78aedd2da834db563f7f808a09c9b7e39a5",
          "lifecycle_status": "current"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:81dfb6e6181819b2b6fff4f87c3c4d5a",
          "content_fingerprint": "sha256:81dfb6e6181819b2b6fff4f87c3c4d5a557e1d8a0c0b873051782c4230e3992c",
          "lifecycle_status": "incomplete"
        }
      ],
      "excluded_material_refs": [
        {
          "material_kind": "stale_relation",
          "opaque_id": "opaque:6d2ba4238b3868ad71df7e78a94d19cb",
          "content_fingerprint": "sha256:6d2ba4238b3868ad71df7e78a94d19cb625751e92635cdebfdc9dfab2ca18130",
          "lifecycle_status": "stale"
        }
      ],
      "stale_relation_ref": null,
      "intervention_provenance_ref": {
        "material_kind": "intervention_provenance",
        "opaque_id": "opaque:89006b3d0882597b75fb9afaf8dc9656",
        "content_fingerprint": "sha256:89006b3d0882597b75fb9afaf8dc9656bb227cc476ebdf2d228566468790168a",
        "lifecycle_status": "current"
      },
      "candidate_intervention_mode": "all_frozen_candidate_components",
      "candidate_component_refs": [],
      "candidate_assignment_fingerprint": "sha256:af99cbc98a24264cdbd9b862778a170d1c0d1dea304701d736eb918d656ba233",
      "binding_fingerprint": "sha256:3ff7c17bd8817943ee2bc8eb6c06e2be145a4054ab6db9b01efa93cfab000325"
    },
    {
      "condition": "exact_current_continuity",
      "holdout_variant": "candidate_component_ablation",
      "existing_reentry_role": "exact_reentry",
      "common_evidence_fingerprint": "sha256:845828a73fe84e3ad4a7424e62eb463c3b32b80551514f79ebafc59b248aa717",
      "continuation_material_refs": [
        {
          "material_kind": "excluded_or_ablated_material",
          "opaque_id": "opaque:0bb15512080f5c224fc8fc82f7b423e6",
          "content_fingerprint": "sha256:0bb15512080f5c224fc8fc82f7b423e6d0c9a1ee643439f7faf7f481626cf75f",
          "lifecycle_status": "retracted"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:1d17fe3e1c8ec8f8b3cfa474f23cc78a",
          "content_fingerprint": "sha256:1d17fe3e1c8ec8f8b3cfa474f23cc78aedd2da834db563f7f808a09c9b7e39a5",
          "lifecycle_status": "current"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:81dfb6e6181819b2b6fff4f87c3c4d5a",
          "content_fingerprint": "sha256:81dfb6e6181819b2b6fff4f87c3c4d5a557e1d8a0c0b873051782c4230e3992c",
          "lifecycle_status": "incomplete"
        }
      ],
      "excluded_material_refs": [
        {
          "material_kind": "stale_relation",
          "opaque_id": "opaque:6d2ba4238b3868ad71df7e78a94d19cb",
          "content_fingerprint": "sha256:6d2ba4238b3868ad71df7e78a94d19cb625751e92635cdebfdc9dfab2ca18130",
          "lifecycle_status": "stale"
        }
      ],
      "stale_relation_ref": null,
      "intervention_provenance_ref": {
        "material_kind": "intervention_provenance",
        "opaque_id": "opaque:e0bd15cff40b3bf4720b5c08e9b78783",
        "content_fingerprint": "sha256:e0bd15cff40b3bf4720b5c08e9b7878372124466208ad613dd7f000cd5a5e17e",
        "lifecycle_status": "current"
      },
      "candidate_intervention_mode": "frozen_candidate_minus_last_component",
      "candidate_component_refs": [],
      "candidate_assignment_fingerprint": "sha256:fdf737d935e689a1f857badb91798d89d668faa0c3d26aaa373425c5068ed688",
      "binding_fingerprint": "sha256:084c60fbfd8492b03311a121c5973a2572a4a482fb4ec85e97aa134876e5face"
    },
    {
      "condition": "stale_or_regime_shift_continuity",
      "holdout_variant": "stale_or_reset",
      "existing_reentry_role": "stale_or_regime_shift_reset",
      "common_evidence_fingerprint": "sha256:845828a73fe84e3ad4a7424e62eb463c3b32b80551514f79ebafc59b248aa717",
      "continuation_material_refs": [
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:1d17fe3e1c8ec8f8b3cfa474f23cc78a",
          "content_fingerprint": "sha256:1d17fe3e1c8ec8f8b3cfa474f23cc78aedd2da834db563f7f808a09c9b7e39a5",
          "lifecycle_status": "current"
        },
        {
          "material_kind": "stale_relation",
          "opaque_id": "opaque:6d2ba4238b3868ad71df7e78a94d19cb",
          "content_fingerprint": "sha256:6d2ba4238b3868ad71df7e78a94d19cb625751e92635cdebfdc9dfab2ca18130",
          "lifecycle_status": "stale"
        }
      ],
      "excluded_material_refs": [
        {
          "material_kind": "excluded_or_ablated_material",
          "opaque_id": "opaque:0bb15512080f5c224fc8fc82f7b423e6",
          "content_fingerprint": "sha256:0bb15512080f5c224fc8fc82f7b423e6d0c9a1ee643439f7faf7f481626cf75f",
          "lifecycle_status": "retracted"
        },
        {
          "material_kind": "continuation_material",
          "opaque_id": "opaque:81dfb6e6181819b2b6fff4f87c3c4d5a",
          "content_fingerprint": "sha256:81dfb6e6181819b2b6fff4f87c3c4d5a557e1d8a0c0b873051782c4230e3992c",
          "lifecycle_status": "incomplete"
        }
      ],
      "stale_relation_ref": {
        "material_kind": "stale_relation",
        "opaque_id": "opaque:6d2ba4238b3868ad71df7e78a94d19cb",
        "content_fingerprint": "sha256:6d2ba4238b3868ad71df7e78a94d19cb625751e92635cdebfdc9dfab2ca18130",
        "lifecycle_status": "stale"
      },
      "intervention_provenance_ref": {
        "material_kind": "intervention_provenance",
        "opaque_id": "opaque:065b855d5742c2572374921b3e2e601c",
        "content_fingerprint": "sha256:065b855d5742c2572374921b3e2e601c73bcdf586ff2c206fe5f0e5db3d8a195",
        "lifecycle_status": "current"
      },
      "candidate_intervention_mode": "no_candidate",
      "candidate_component_refs": [],
      "candidate_assignment_fingerprint": "sha256:31fc87b803094f3ffd16da9aeff034a51032001aec1fc448fe7857800983218b",
      "binding_fingerprint": "sha256:b56b86d58d2b8685141cc4f92ae5c24e7ca1cb461d0c397c9f765449852fe1ad"
    }
  ],
  "source_content_included": false,
  "integrity": {
    "algorithm": "sha256",
    "canonicalization": "augnes-json-c14n-v0_1",
    "fingerprint_scope": "commissioned_work_case_commitment_without_integrity_fingerprint",
    "fingerprint": "sha256:2a3bc0eef3c736a997718caa0d8d5e64b770242a27c430356e752917c4b50ac6"
  }
} as const satisfies CommissionedWorkCaseCommitmentV01;
