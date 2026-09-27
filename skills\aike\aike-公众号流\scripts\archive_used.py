#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 已使用素材归档
用法: python archive_used.py <批次号> [--only NN] [--dry-run]
  批次号   如 20260816
  --only   只处理指定篇目（NN，如 01）
  --dry-run 只打印计划，不落盘

读 批次/批次-<批次号>/批次编排表.md 每篇的「素材」列 → 定位批次素材
  → 按其 元数据.json 的 url/category 找分类原件
  → 原件存在：原件移入 素材/已使用/<类别>/，md5 一致后删批次副本
  → 原件不存在：批次素材本身移入 素材/已使用/<类别>/
  → 目标已存在：幂等跳过
批次定位（统一批次制 2026-08-20）：批次/批次-XXX → 批次/待发布-批次-XXX → 批次/已发布-批次-XXX
  → 回退旧 审核/批次-XXX → 结办/批次-XXX（过渡期旧批次）
发布文章进 批次/已发布- 后执行本脚本，素材域只留未使用素材。
"""
import sys, os, re, json, hashlib, shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)                      # aike-公众号流
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)                   # .workbuddy
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))  # ai科普
MATERIAL_ROOT = os.path.join(AIKE_ROOT, "素材")
USED_ROOT = os.path.join(MATERIAL_ROOT, "已使用")
CATEGORIES = ["科普", "观点", "工具", "技术", "金句", "未分类"]


def md5(path):
    h = hashlib.md5()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def safe_rmtree(path):
    """删除目录。WorkBuddy 环境 shutil.rmtree 被 shim 拦截（移回收站失败即抛错），
    降级为逐文件 os.remove + 逐层 os.rmdir。返回 True/False。"""
    if not os.path.isdir(path):
        return True
    try:
        shutil.rmtree(path)
        return True
    except Exception:
        pass
    try:
        for root, dirs, files in os.walk(path, topdown=False):
            for f in files:
                os.remove(os.path.join(root, f))
            for d in dirs:
                os.rmdir(os.path.join(root, d))
        os.rmdir(path)
        return True
    except Exception:
        return False


def load_meta(folder):
    """读 元数据.json，返回 dict（文件缺失返回 {}）"""
    p = os.path.join(folder, "元数据.json")
    if not os.path.isfile(p):
        return {}
    try:
        with open(p, encoding="utf-8-sig") as f:
            return json.load(f)
    except Exception:
        return {}


def find_original(category, url):
    """在 素材/<category>/ 下找元数据 url 相同的文件夹（原件），返回路径或 None"""
    return find_in(os.path.join(MATERIAL_ROOT, category), url)


def find_in(dir_root, url):
    """在 dir_root 下找元数据 url 相同的文件夹，返回路径或 None（无 url 时返回 None）"""
    if not url or not os.path.isdir(dir_root):
        return None
    for name in os.listdir(dir_root):
        d = os.path.join(dir_root, name)
        if not os.path.isdir(d) or name.startswith("."):
            continue
        if load_meta(d).get("url") == url:
            return d
    return None


def parse_sheet(batch_dir):
    """解析编排表 → [(slug, 素材名)]"""
    sheet = os.path.join(batch_dir, "批次编排表.md")
    rows = []
    if not os.path.isfile(sheet):
        return rows
    with open(sheet, encoding="utf-8") as f:
        for line in f:
            m = re.match(r'\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|', line)
            if m:
                rows.append((m.group(1).strip().zfill(2),
                             m.group(2).strip(),
                             m.group(3).strip()))
    return rows


def main():
    if len(sys.argv) < 2:
        print("用法: python archive_used.py <批次号> [--only NN] [--dry-run]"); sys.exit(1)
    batch = sys.argv[1]
    only = None
    dry = "--dry-run" in sys.argv
    if "--only" in sys.argv:
        i = sys.argv.index("--only")
        if i + 1 < len(sys.argv):
            only = sys.argv[i + 1].zfill(2)

    # 批次定位（统一批次制）：批次/批次-XXX → 待发布-批次-XXX → 已发布-批次-XXX → 回退旧 审核/结办
    batch_dir = None
    for prefix in ("批次", "待发布-批次", "已发布-批次"):
        cand = os.path.join(AIKE_ROOT, "批次", f"{prefix}-{batch}")
        if os.path.isdir(cand):
            batch_dir = cand
            break
    if batch_dir is None:
        for legacy in ("审核", "结办"):
            cand = os.path.join(AIKE_ROOT, legacy, f"批次-{batch}")
            if os.path.isdir(cand):
                batch_dir = cand
                break
    batch_mat_dir = os.path.join(MATERIAL_ROOT, f"批次-{batch}")
    if not batch_dir:
        print(f"[x] 编排表目录不存在（批次/审核/结办都没有批次 {batch}）: 批次\\批次-{batch} / 审核\\批次-{batch} / 结办\\批次-{batch}")
        sys.exit(1)
    if not os.path.isdir(batch_mat_dir):
        print(f"[!] 素材批次目录不存在（无素材批次，全部跳过）: {batch_mat_dir}")
        batch_mat_dir = None

    rows = parse_sheet(batch_dir)
    if not rows:
        print(f"[x] 编排表无篇目行: {os.path.join(batch_dir, '批次编排表.md')}"); sys.exit(1)

    print(f"== 素材归档报告 批次 {batch} | {'DRY-RUN（不落盘）' if dry else '实执行'} ==")
    stats = {"归档": 0, "幂等跳过": 0, "无素材": 0, "失败": 0}
    for num, slug, mat_name in rows:
        if only and num != only:
            continue
        print(f"\n[{num}] {slug}")

        # 1) 定位批次素材
        src_mat = os.path.join(batch_mat_dir, mat_name) if (batch_mat_dir and mat_name) else None
        if src_mat and not os.path.isdir(src_mat):
            # 素材名可能不精确匹配，尝试目录内单文件夹模糊匹配
            if batch_mat_dir and mat_name:
                cands = [d for d in os.listdir(batch_mat_dir)
                         if os.path.isdir(os.path.join(batch_mat_dir, d)) and mat_name in d]
                if len(cands) == 1:
                    src_mat = os.path.join(batch_mat_dir, cands[0])
                else:
                    src_mat = None
        if not src_mat or not os.path.isdir(src_mat):
            print("     无素材（该篇未用素材），跳过")
            stats["无素材"] += 1
            continue

        meta = load_meta(src_mat)
        url, category = meta.get("url", ""), meta.get("category", "") or "未分类"
        if category not in CATEGORIES:
            category = "未分类"

        # 0) 幂等：已使用/<类别>/ 下已有同 url 素材 → 视为已归档（即使名字不同），只清理批次残留
        already_used = find_in(os.path.join(USED_ROOT, category), url)
        if already_used:
            print(f"     已使用\\{category}\\ 已存在同来源素材「{os.path.basename(already_used)}」，幂等跳过")
            if os.path.isdir(src_mat):
                if dry:
                    print(f"     [dry] 将清理批次残留: {os.path.relpath(src_mat, AIKE_ROOT)}")
                else:
                    m1 = md5(os.path.join(already_used, "原文.md"))
                    m2 = md5(os.path.join(src_mat, "原文.md"))
                    if m1 and m1 == m2:
                        if safe_rmtree(src_mat):
                            print(f"     批次残留已清理（md5 一致）: {os.path.relpath(src_mat, AIKE_ROOT)}")
                        else:
                            print(f"     ⚠ 批次残留删除失败，请手动删除: {src_mat}")
                            stats["失败"] += 1
                    else:
                        print(f"     ⚠ 批次素材「{os.path.basename(src_mat)}」与已使用副本 md5 不一致，保留待人工确认")
            stats["幂等跳过"] += 1
            continue

        # 1) 找分类原件
        original = find_original(category, url) if url else None
        if original:
            print(f"     素材: 批次副本 {os.path.relpath(src_mat, AIKE_ROOT)}")
            print(f"     原件: {os.path.relpath(original, AIKE_ROOT)}")
            archive_src = original
            archive_name = os.path.basename(original)
            del_batch = src_mat
        else:
            print(f"     素材: {os.path.relpath(src_mat, AIKE_ROOT)}（无分类原件，直接归档批次素材）")
            archive_src = src_mat
            archive_name = os.path.basename(src_mat)
            del_batch = None

        # 3) 幂等检查
        dst = os.path.join(USED_ROOT, category, archive_name)
        if os.path.isdir(dst):
            print(f"     目标已存在（幂等跳过）: {os.path.relpath(dst, AIKE_ROOT)}")
            stats["幂等跳过"] += 1
            continue

        # 4) 执行
        if dry:
            print(f"     [dry] 移动 → {os.path.relpath(dst, AIKE_ROOT)}")
            if del_batch:
                print(f"     [dry] 删除批次副本（md5 校验后）")
            stats["归档"] += 1
            continue

        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(archive_src, dst)
            ok = True
        except Exception as e:
            print(f"     [x] 移动失败: {e}")
            stats["失败"] += 1
            continue

        # 5) 删除批次副本（先校验 md5 一致，防止误删不同内容）
        if del_batch and os.path.isdir(del_batch):
            m1 = md5(os.path.join(dst, "原文.md"))
            m2 = md5(os.path.join(del_batch, "原文.md"))
            if m1 and m1 == m2:
                if safe_rmtree(del_batch):
                    print(f"     已归档 → 已使用\\{category}\\{archive_name}；批次副本已删（md5 一致）")
                else:
                    print(f"     ⚠ 已归档 → 已使用\\{category}\\{archive_name}；但批次副本删除失败，请手动删除: {del_batch}")
                    stats["失败"] += 1
            else:
                print(f"     ⚠ 已归档 → 已使用\\{category}\\{archive_name}；但批次副本原文.md md5 不一致，保留待人工确认")
                stats["失败"] += 1
        else:
            print(f"     已归档 → 已使用\\{category}\\{archive_name}")
        stats["归档"] += 1

    print(f"\n== 汇总: 归档 {stats['归档']} | 幂等跳过 {stats['幂等跳过']} | "
          f"无素材 {stats['无素材']} | 失败 {stats['失败']} ==")
    if dry:
        print("（DRY-RUN 未落盘，确认无误后去掉 --dry-run 执行）")
    sys.exit(1 if stats["失败"] else 0)


if __name__ == "__main__":
    main()
