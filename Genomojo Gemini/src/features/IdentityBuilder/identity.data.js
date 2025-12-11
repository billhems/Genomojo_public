export const ROOT_ID = 'root';

export const DATA_SET = [
    // --- Top Level Categories ---
    { id: 'cat_pro', label: 'Profession', type: 'category', color: '#3b82f6' }, // Blue
    { id: 'cat_fam', label: 'Family', type: 'category', color: '#ef4444' }, // Red
    { id: 'cat_hob', label: 'Hobbies', type: 'category', color: '#10b981' }, // Green
    { id: 'cat_val', label: 'Values', type: 'category', color: '#8b5cf6' }, // Purple
    { id: 'cat_rel', label: 'Social', type: 'category', color: '#f59e0b' }, // Orange

    // --- Profession Tree ---
    { id: 'pro_tech', parentId: 'cat_pro', label: 'Tech', hasChildren: true, color: '#60a5fa' },
    { id: 'pro_art', parentId: 'cat_pro', label: 'Creative', hasChildren: true, color: '#60a5fa' },
    { id: 'pro_biz', parentId: 'cat_pro', label: 'Business', hasChildren: true, color: '#60a5fa' },
    { id: 'pro_health', parentId: 'cat_pro', label: 'Healthcare', hasChildren: true, color: '#60a5fa' },

    { id: 'p_dev', parentId: 'pro_tech', label: 'Developer', color: '#93c5fd' },
    { id: 'p_des', parentId: 'pro_tech', label: 'Designer', color: '#93c5fd' },
    { id: 'p_data', parentId: 'pro_tech', label: 'Data Scientist', color: '#93c5fd' },
    { id: 'p_writ', parentId: 'pro_art', label: 'Writer', color: '#93c5fd' },
    { id: 'p_paint', parentId: 'pro_art', label: 'Artist', color: '#93c5fd' },
    { id: 'p_found', parentId: 'pro_biz', label: 'Founder', color: '#93c5fd' },
    { id: 'p_free', parentId: 'pro_biz', label: 'Freelancer', color: '#93c5fd' },

    // --- Family Tree ---
    { id: 'fam_par', parentId: 'cat_fam', label: 'Parent', hasChildren: true, color: '#f87171' },
    { id: 'fam_sib', parentId: 'cat_fam', label: 'Sibling', hasChildren: true, color: '#f87171' },
    { id: 'fam_part', parentId: 'cat_fam', label: 'Partner', color: '#f87171' },

    { id: 'f_newpar', parentId: 'fam_par', label: 'New Parent', color: '#fca5a5' },
    { id: 'f_singpar', parentId: 'fam_par', label: 'Single Parent', color: '#fca5a5' },
    { id: 'f_grand', parentId: 'fam_par', label: 'Grandparent', color: '#fca5a5' },
    { id: 'f_old', parentId: 'fam_sib', label: 'Oldest Child', color: '#fca5a5' },
    { id: 'f_mid', parentId: 'fam_sib', label: 'Middle Child', color: '#fca5a5' },

    // --- Hobbies Tree ---
    { id: 'hob_sport', parentId: 'cat_hob', label: 'Sports', hasChildren: true, color: '#34d399' },
    { id: 'hob_art', parentId: 'cat_hob', label: 'Arts & Crafts', hasChildren: true, color: '#34d399' },
    { id: 'hob_game', parentId: 'cat_hob', label: 'Gaming', color: '#34d399' },
    { id: 'hob_trav', parentId: 'cat_hob', label: 'Traveler', color: '#34d399' },

    { id: 'h_run', parentId: 'hob_sport', label: 'Runner', hasChildren: true, color: '#6ee7b7' },
    { id: 'h_gym', parentId: 'hob_sport', label: 'Gym Goer', color: '#6ee7b7' },
    { id: 'h_swim', parentId: 'hob_sport', label: 'Swimmer', color: '#6ee7b7' },
    { id: 'h_marathon', parentId: 'h_run', label: 'Marathoner', color: '#a7f3d0' },
    { id: 'h_sprinter', parentId: 'h_run', label: 'Sprinter', color: '#a7f3d0' },
    { id: 'h_jog', parentId: 'h_run', label: 'Casual Jogger', color: '#a7f3d0' },

    // --- Values ---
    { id: 'val_amb', parentId: 'cat_val', label: 'Ambitious', color: '#a78bfa' },
    { id: 'val_kind', parentId: 'cat_val', label: 'Kind', color: '#a78bfa' },
    { id: 'val_cre', parentId: 'cat_val', label: 'Creative', color: '#a78bfa' },
    { id: 'val_logic', parentId: 'cat_val', label: 'Logical', color: '#a78bfa' },
    { id: 'val_spir', parentId: 'cat_val', label: 'Spiritual', color: '#a78bfa' },

    // --- Social ---
    { id: 'soc_ext', parentId: 'cat_rel', label: 'Extrovert', color: '#fbbf24' },
    { id: 'soc_int', parentId: 'cat_rel', label: 'Introvert', color: '#fbbf24' },
    { id: 'soc_list', parentId: 'cat_rel', label: 'Listener', color: '#fbbf24' },
    { id: 'soc_lead', parentId: 'cat_rel', label: 'Leader', color: '#fbbf24' },
];
